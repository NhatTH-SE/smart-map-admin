package com.fpt.edu.vn.smart_map.controller;

import com.fpt.edu.vn.smart_map.dto.MapDto;
import com.fpt.edu.vn.smart_map.dto.StationDto;
import com.fpt.edu.vn.smart_map.service.CodeGeneratorService;
import com.fpt.edu.vn.smart_map.service.MapService;
import com.fpt.edu.vn.smart_map.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Module 6: C++ Code Generator — sinh cấu hình trạm cho ESP32.
 *
 * <p>Trả về đoạn text C++ đã định dạng sẵn, client copy thẳng vào
 * <code>main.cpp</code> của firmware.</p>
 *
 * <p>Endpoints:
 * <ul>
 *   <li><code>GET /api/code/maps/{id}</code> — text/plain, header
 *       <code>Content-Disposition: attachment; filename="map_{id}_stations.cpp"</code>.</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
public class CodeGeneratorController {

    private final CodeGeneratorService codeGeneratorService;
    private final MapService mapService;
    private final StationService stationService;

    @GetMapping(value = "/maps/{id}", produces = MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8")
    public ResponseEntity<byte[]> generateForMap(@PathVariable Long id) {
        // 404 nếu bản đồ không tồn tại (getById đã ném ApiException → 404)
        MapDto.Response map = mapService.getById(id);
        List<StationDto.Response> stations = stationService.getByMapId(id);

        String cpp = codeGeneratorService.generate(map.getId(), map.getName(), stations);

        byte[] body = cpp.getBytes(StandardCharsets.UTF_8);
        String filename = "map_" + id + "_stations.cpp";

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, Integer.toString(body.length))
                .header("X-Station-Count", Integer.toString(stations.size()))
                .body(body);
    }
}