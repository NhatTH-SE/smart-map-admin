package com.fpt.edu.vn.smart_map.service;

import com.fpt.edu.vn.smart_map.dto.StationDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho {@link CodeGeneratorService}.
 * Đảm bảo output ổn định (không phụ thuộc thứ tự input), escape đúng ký tự đặc biệt,
 * và cảnh báo LOST.
 */
class CodeGeneratorServiceTest {

    private final CodeGeneratorService svc = new CodeGeneratorService();

    @Test
    void generate_emitsStableHeaderAndSortedEntries() {
        List<StationDto.Response> input = List.of(
                resp(2L, "Thu Vien",  300d, 150d, "11:22:33:44:55:66", "ACTIVE"),
                resp(1L, "Phong IT",  120d, 250d, "FF:EE:DD:CC:BB:AA", "ACTIVE")
        );

        String out = svc.generate(7L, "Tang 1 - Toa A", input);

        assertTrue(out.startsWith("// ============================================================\n"),
                "must start with the divider banner");
        assertTrue(out.contains("// Map ID   : 7\n"));
        assertTrue(out.contains("// Map Name : Tang 1 - Toa A\n"));
        assertTrue(out.contains("const int SO_LUONG_TRAM = 2;\n"));
        assertTrue(out.contains("ToaDoMain cac_tram[SO_LUONG_TRAM] = {"));

        // Sắp xếp theo id ASC → id=1 phải xuất hiện trước id=2
        int idx1 = out.indexOf("{1, \"Phong IT\"");
        int idx2 = out.indexOf("{2, \"Thu Vien\"");
        assertTrue(idx1 > 0 && idx2 > idx1, "id=1 phải đứng trước id=2");

        assertTrue(out.endsWith("};\n"), "phải kết thúc bằng };\n");
    }

    @Test
    void generate_emitsNoWarningWhenAllActive() {
        String out = svc.generate(1L, "M", List.of(
                resp(1L, "A", 0d, 0d, "AA:AA:AA:AA:AA:AA", "ACTIVE")));
        assertFalse(out.contains("WARNING"), "không cảnh báo khi không có LOST");
    }

    @Test
    void generate_warnsOnLostStations() {
        String out = svc.generate(1L, "M", List.of(
                resp(1L, "A", 0d, 0d, "AA:AA:AA:AA:AA:AA", "ACTIVE"),
                resp(2L, "B", 0d, 0d, "BB:BB:BB:BB:BB:BB", "LOST")));
        assertTrue(out.contains("// WARNING  : 1 station(s) marked LOST"));
    }

    @Test
    void generate_emitsEmptyArrayWhenNoStations() {
        String out = svc.generate(1L, "M", List.of());
        assertTrue(out.contains("const int SO_LUONG_TRAM = 0;\n"));
        assertTrue(out.contains("// (no stations on this map)"));
        assertTrue(out.contains("};\n"));
    }

    @Test
    void generate_escapesQuotesAndBackslashes() {
        String out = svc.generate(1L, "M", List.of(
                resp(1L, "Phòng \"VIP\" \\nhà A", 0d, 0d, "AA:AA:AA:AA:AA:AA", "ACTIVE")));
        assertTrue(out.contains("\"Phòng \\\"VIP\\\" \\\\nhà A\""),
                "phải escape cả nháy và backslash");
    }

    @Test
    void generate_handlesNullAndNaNCoordinatesAsZero() {
        StationDto.Response nan = resp(1L, "X", Double.NaN, Double.POSITIVE_INFINITY,
                "AA:AA:AA:AA:AA:AA", "ACTIVE");
        StationDto.Response nullXY = respNull(2L, "Y", "BB:BB:BB:BB:BB:BB", "ACTIVE");

        String out = svc.generate(1L, "M", List.of(nan, nullXY));

        assertTrue(out.contains("{1, \"X\", 0, 0,"), "NaN/Inf → 0");
        assertTrue(out.contains("{2, \"Y\", 0, 0,"), "null → 0");
    }

    @Test
    void generate_skipsNullStationEntries() {
        String out = svc.generate(1L, "M", Arrays.asList(
                resp(1L, "A", 0d, 0d, "AA:AA:AA:AA:AA:AA", "ACTIVE"),
                null));
        assertTrue(out.contains("SO_LUONG_TRAM = 1"));
        assertFalse(out.contains("\"null\""));
    }

    // ----- helpers ----------------------------------------------------------

    /** Tạo station với toạ độ double cụ thể. */
    private StationDto.Response resp(Long id, String name, double x, double y,
                                     String mac, String status) {
        return StationDto.Response.builder()
                .id(id)
                .mapId(1L)
                .mapName("M")
                .name(name)
                .macAddress(mac)
                .coordX(x)
                .coordY(y)
                .status(status)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-01T00:00:00Z"))
                .build();
    }

    /** Tạo station với toạ độ null (test cho branch null-safety). */
    private StationDto.Response respNull(Long id, String name, String mac, String status) {
        return StationDto.Response.builder()
                .id(id)
                .mapId(1L)
                .mapName("M")
                .name(name)
                .macAddress(mac)
                .coordX(null)
                .coordY(null)
                .status(status)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-01T00:00:00Z"))
                .build();
    }
}